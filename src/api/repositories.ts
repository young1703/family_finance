import type {
  CategoryCreateInput,
  FlowCreateInput,
  HouseholdCreateInput,
  MemberInviteInput,
  NodeCreateInput,
  NodePositionInput
} from "./schemas";

export type RequestContext = {
  userId: string;
  householdId?: string;
};

export type HouseholdRecord = {
  id: string;
  name: string;
  baseCurrencyCode: string;
};

export type DashboardRecord = {
  month: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  savingRate: number;
};

export interface HouseholdRepository {
  createWithOwner(input: HouseholdCreateInput, ctx: RequestContext): Promise<HouseholdRecord>;
  inviteMember(householdId: string, input: MemberInviteInput, ctx: RequestContext): Promise<void>;
}

export interface CategoryRepository {
  create(householdId: string, input: CategoryCreateInput, ctx: RequestContext): Promise<{ id: string }>;
}

export interface NodeRepository {
  create(householdId: string, input: NodeCreateInput, ctx: RequestContext): Promise<{ id: string }>;
  updatePosition(nodeId: string, input: NodePositionInput, ctx: RequestContext): Promise<void>;
}

export interface FlowRepository {
  create(householdId: string, input: FlowCreateInput, ctx: RequestContext): Promise<{ id: string }>;
}

export interface DashboardRepository {
  get(householdId: string, month: string, ctx: RequestContext): Promise<DashboardRecord>;
}

export interface FxRepository {
  getLatest(base: string, quote: string): Promise<{ base: string; quote: string; rate: number; fetchedAt: string }>;
}
