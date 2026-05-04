/**
 * API contract skeleton for Family Finance MVP.
 *
 * This module centralizes route/validation mapping.
 */
import {
  categoryCreateSchema,
  dashboardQuerySchema,
  flowCreateSchema,
  fxQuerySchema,
  householdCreateSchema,
  memberInviteSchema,
  nodeCreateSchema,
  nodePositionSchema
} from "./schemas";

export const apiContracts = {
  createHousehold: {
    method: "POST",
    path: "/api/households",
    body: householdCreateSchema
  },
  inviteMember: {
    method: "POST",
    path: "/api/households/:id/invites",
    body: memberInviteSchema
  },
  createCategory: {
    method: "POST",
    path: "/api/households/:id/categories",
    body: categoryCreateSchema
  },
  createNode: {
    method: "POST",
    path: "/api/households/:id/nodes",
    body: nodeCreateSchema
  },
  updateNodePosition: {
    method: "PATCH",
    path: "/api/nodes/:nodeId/position",
    body: nodePositionSchema
  },
  createFlow: {
    method: "POST",
    path: "/api/households/:id/flows",
    body: flowCreateSchema
  },
  dashboard: {
    method: "GET",
    path: "/api/households/:id/dashboard",
    query: dashboardQuerySchema
  },
  fxLatest: {
    method: "GET",
    path: "/api/fx/latest",
    query: fxQuerySchema
  }
} as const;
