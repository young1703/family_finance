import { z } from "zod";
import { badRequest } from "./errors";
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
import type {
  CategoryRepository,
  DashboardRepository,
  FlowRepository,
  FxRepository,
  HouseholdRepository,
  NodeRepository,
  RequestContext
} from "./repositories";

const householdIdParamSchema = z.object({ id: z.string().uuid() });
const nodeIdParamSchema = z.object({ nodeId: z.string().uuid() });

type JsonResult<T> = { status: number; data: T };

const parseOrThrow = <T>(schema: z.ZodType<T>, payload: unknown): T => {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues.map((issue) => issue.message).join(", "), "VALIDATION_ERROR");
  }
  return parsed.data;
};

export const createHouseholdHandler = async (
  body: unknown,
  ctx: RequestContext,
  repos: { households: HouseholdRepository }
): Promise<JsonResult<{ id: string }>> => {
  const input = parseOrThrow(householdCreateSchema, body);
  const row = await repos.households.createWithOwner(input, ctx);
  return { status: 201, data: { id: row.id } };
};

export const inviteMemberHandler = async (
  params: unknown,
  body: unknown,
  ctx: RequestContext,
  repos: { households: HouseholdRepository }
): Promise<JsonResult<{ ok: true }>> => {
  const { id } = parseOrThrow(householdIdParamSchema, params);
  const input = parseOrThrow(memberInviteSchema, body);
  await repos.households.inviteMember(id, input, ctx);
  return { status: 200, data: { ok: true } };
};

export const createCategoryHandler = async (
  params: unknown,
  body: unknown,
  ctx: RequestContext,
  repos: { categories: CategoryRepository }
): Promise<JsonResult<{ id: string }>> => {
  const { id } = parseOrThrow(householdIdParamSchema, params);
  const input = parseOrThrow(categoryCreateSchema, body);
  return { status: 201, data: await repos.categories.create(id, input, ctx) };
};

export const createNodeHandler = async (
  params: unknown,
  body: unknown,
  ctx: RequestContext,
  repos: { nodes: NodeRepository }
): Promise<JsonResult<{ id: string }>> => {
  const { id } = parseOrThrow(householdIdParamSchema, params);
  const input = parseOrThrow(nodeCreateSchema, body);
  return { status: 201, data: await repos.nodes.create(id, input, ctx) };
};

export const updateNodePositionHandler = async (
  params: unknown,
  body: unknown,
  ctx: RequestContext,
  repos: { nodes: NodeRepository }
): Promise<JsonResult<{ ok: true }>> => {
  const { nodeId } = parseOrThrow(nodeIdParamSchema, params);
  const input = parseOrThrow(nodePositionSchema, body);
  await repos.nodes.updatePosition(nodeId, input, ctx);
  return { status: 200, data: { ok: true } };
};

export const createFlowHandler = async (
  params: unknown,
  body: unknown,
  ctx: RequestContext,
  repos: { flows: FlowRepository }
): Promise<JsonResult<{ id: string }>> => {
  const { id } = parseOrThrow(householdIdParamSchema, params);
  const input = parseOrThrow(flowCreateSchema, body);
  return { status: 201, data: await repos.flows.create(id, input, ctx) };
};

export const dashboardHandler = async (
  params: unknown,
  query: unknown,
  ctx: RequestContext,
  repos: { dashboard: DashboardRepository }
): Promise<JsonResult<Awaited<ReturnType<DashboardRepository["get"]>>>> => {
  const { id } = parseOrThrow(householdIdParamSchema, params);
  const { month } = parseOrThrow(dashboardQuerySchema, query);
  const data = await repos.dashboard.get(id, month, ctx);
  return { status: 200, data };
};

export const fxLatestHandler = async (
  query: unknown,
  repos: { fx: FxRepository }
): Promise<JsonResult<Awaited<ReturnType<FxRepository["getLatest"]>>>> => {
  const { base, quote } = parseOrThrow(fxQuerySchema, query);
  const data = await repos.fx.getLatest(base, quote);
  return { status: 200, data };
};
