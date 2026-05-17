import type { NextFunction, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserRole } from '@tailor-cms/interfaces/role';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';

const { UserGroup, UserGroupMember } = db;

// Param middleware: loads the UserGroup onto req and gates access.
// Non-system-admins must hold the ADMIN role on the group itself,
// otherwise every /:id/* route returns 403 - read access is the same
// gate as write access here.
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
  if (!user.isAdmin()) {
    const isGroupAdmin = await UserGroupMember.findOne({
      where: { userId: user.id, groupId: group.id, role: UserRole.ADMIN },
    });
    if (!isGroupAdmin) {
      return createError(StatusCodes.FORBIDDEN, 'Access denied');
    }
  }
  req.userGroup = group;
  next();
}
