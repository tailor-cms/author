import type { NextFunction, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  canWriteUserGroup,
  hasUserGroupAdminAccess,
} from '@tailor-cms/utils';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';
import find from 'lodash/find.js';

const { UserGroup } = db;

// Param middleware: loads the UserGroup onto req and gates every /:id route
// on hasUserGroupAdminAccess - system admins, or ADMIN members of the group
// (the member-management surface). Reads share this gate with writes here.
export async function getUserGroup(
  req: any,
  _res: Response,
  next: NextFunction,
  id: string,
) {
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) {
    return createError(StatusCodes.NOT_FOUND, 'User group not found');
  }
  const group = await UserGroup.findByPk(groupId, { paranoid: false });
  if (!group) {
    return createError(StatusCodes.NOT_FOUND, 'User group not found');
  }
  const { user } = req;
  const membership = find(user.userGroupMembers, { groupId: group.id });
  const access = { userRole: user.role, groupRole: membership?.role };
  if (!hasUserGroupAdminAccess(access)) {
    return createError(StatusCodes.FORBIDDEN, 'Access denied');
  }
  req.userGroup = group;
  next();
}

// Writing the group entity (create/rename/logo/delete) is a system-admin
// surface - narrower than the member management getUserGroup opens to group
// admins. Returns 403, consistent with getUserGroup's own denial. INTEGRATION
// counts as a system admin here, matching every rule in @tailor-cms/utils.
export function authorizeGroupWrite(
  req: any,
  _res: Response,
  next: NextFunction,
) {
  if (canWriteUserGroup({ userRole: req.user.role })) return next();
  return createError(StatusCodes.FORBIDDEN, 'Access denied');
}
