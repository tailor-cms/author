// Virtual asset folders, client side. Folders are `/`-delimited prefixes stored
// on each asset as `meta.folder`; there is no folder model. The server only
// knows folders that have at least one asset, so empty folders the user creates
// live in localStorage until something lands in them. This composable owns the
// folder cache (fetched via `refresh`), merges it with the local empty folders
// into a navigable tree and owns the current path (the folder being browsed).
import { useCurrentRepository } from '@/stores/current-repository';
import api from '@/api/repositoryAsset';

const MAX_SEGMENT = 80;
const MAX_DEPTH = 10;

export interface FolderNode {
  path: string;
  name: string;
  // True while the folder exists only locally (no asset filed under it yet).
  isLocal: boolean;
}

export interface Breadcrumb {
  label: string;
  path: string;
}

const getLocalFolderKey = (uid: string) => `tailor.assets.folders.${uid}`;

function sanitizeSegment(segment: string): string {
  return segment.trim().slice(0, MAX_SEGMENT);
}

// Normalize a (possibly nested) folder path: split, sanitize, drop empties,
// cap depth. Returns '' for root.
function normalizePath(input: string): string {
  return input
    .split('/')
    .map(sanitizeSegment)
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .slice(0, MAX_DEPTH)
    .join('/');
}

function parentOf(path: string): string {
  const index = path.lastIndexOf('/');
  return index === -1 ? '' : path.slice(0, index);
}

function nameOf(path: string): string {
  const index = path.lastIndexOf('/');
  return index === -1 ? path : path.slice(index + 1);
}

// Every ancestor prefix of a path, inclusive: `a/b/c` -> [a, a/b, a/b/c]. Lets a
// deep folder imply its parents exist as navigable folders.
function prefixesOf(path: string): string[] {
  const out: string[] = [];
  let acc = '';
  for (const segment of path.split('/')) {
    acc = acc ? `${acc}/${segment}` : segment;
    out.push(acc);
  }
  return out;
}

function readStorage(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((it) => typeof it === 'string') : [];
  } catch {
    return [];
  }
}

function writeStorage(key: string, value: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort; ignore quota / privacy-mode failures
  }
}

export function useAssetFolders() {
  const currentRepository = useCurrentRepository();
  const repositoryKey = computed(() => currentRepository.repository?.uid);

  const hasLoadedFolders = ref(false);
  const serverFolders = ref<string[]>([]);
  const localFolders = ref<string[]>([]);
  const currentPath = ref('');

  // Local (empty) folders are per repository; (re)load when it changes. Keyed
  // by the repo's uid (not its numeric id) so a DB reset that recycles an
  // id can't surface a previous repository's local folders.
  watch(
    repositoryKey,
    (uid) => {
      localFolders.value = uid ? readStorage(getLocalFolderKey(uid)) : [];
      currentPath.value = '';
    },
    { immediate: true },
  );

  function persistLocalFolders() {
    if (!repositoryKey.value) return;
    writeStorage(getLocalFolderKey(repositoryKey.value), localFolders.value);
  }

  // Folders the server actually has (expanded to all ancestor prefixes).
  const serverSet = computed(
    () => new Set(serverFolders.value.flatMap(prefixesOf)),
  );

  // Union of server + local folders, each expanded to its prefixes. Seeds from
  // `serverSet` so the server prefixes aren't re-expanded; only local ones are
  // added on top.
  const allFolders = computed(() => {
    const set = new Set<string>(serverSet.value);
    for (const path of localFolders.value) {
      for (const prefix of prefixesOf(path)) set.add(prefix);
    }
    return [...set].sort();
  });

  // True when the folder being browsed exists only locally (created but not yet
  // backed by an asset).
  const isLocalFolder = computed(
    () => !!currentPath.value && !serverSet.value.has(currentPath.value),
  );

  // Immediate children of the current path, sorted by name. Local-only
  // folders are flagged so the UI can mark them empty.
  const subfolders = computed<FolderNode[]>(() =>
    allFolders.value
      .filter((path) => parentOf(path) === currentPath.value)
      .map((path) => ({
        path,
        name: nameOf(path),
        isLocal: !serverSet.value.has(path),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  const breadcrumbs = computed<Breadcrumb[]>(() => {
    const crumbs: Breadcrumb[] = [{ label: 'Home', path: '' }];
    if (currentPath.value) {
      for (const path of prefixesOf(currentPath.value)) {
        crumbs.push({ label: nameOf(path), path });
      }
    }
    return crumbs;
  });

  function navigateTo(path: string) {
    currentPath.value = normalizePath(path);
  }

  function navigateUp() {
    currentPath.value = parentOf(currentPath.value);
  }

  // Create an empty folder (relative to the current path) and remember it
  // locally. Returns the new path, or '' if the name was unusable.
  function createFolder(name: string): string {
    const base = currentPath.value;
    const path = normalizePath(base ? `${base}/${name}` : name);
    if (!path || allFolders.value.includes(path)) return path;
    localFolders.value = [...localFolders.value, path];
    persistLocalFolders();
    return path;
  }

  // Forget a locally-created empty folder (and any empty descendants). Only
  // local folders can be removed this way; server folders disappear on their
  // own once empty.
  function removeLocalFolder(path: string) {
    localFolders.value = localFolders.value.filter(
      (it) => it !== path && !it.startsWith(`${path}/`),
    );
    persistLocalFolders();
    if (currentPath.value === path || currentPath.value.startsWith(`${path}/`)) {
      currentPath.value = parentOf(path);
    }
  }

  // Adopt a server folder set and drop any local folder it now backs
  function applyFolders(folders: string[]) {
    serverFolders.value = folders;
    const isServerBacked = (path: string) => serverSet.value.has(path);
    if (localFolders.value.some(isServerBacked)) {
      localFolders.value = localFolders.value.filter(
        (path) => !isServerBacked(path),
      );
      persistLocalFolders();
    }
  }

  // Pull the repository's folder set from the server into the cache.
  async function refresh() {
    if (!currentRepository.repositoryId) return;
    applyFolders(await api.listFolders(currentRepository.repositoryId));
    hasLoadedFolders.value = true;
  }

  // Optimistically record a folder that's just been used (upload/move target)
  // so it shows immediately, ahead of the reconciling `refresh`.
  function registerFolder(folder: string) {
    const path = normalizePath(folder);
    if (!path || serverFolders.value.includes(path)) return;
    applyFolders([...serverFolders.value, path]);
  }

  return {
    hasLoadedFolders,
    currentPath,
    subfolders,
    breadcrumbs,
    allFolders,
    isLocalFolder,
    navigateTo,
    navigateUp,
    createFolder,
    removeLocalFolder,
    refresh,
    registerFolder,
  };
}
