import { t, protectedProcedure } from "../init";
import { getMinutesLeft, getTransformationsLeft } from "../../lib/limits";

function extractLimitResult(result: any) {
  // Only extract the properties we need to avoid React hydration issues
  // Preserve null values for unlimited plans
  return {
    remaining: result?.remaining !== undefined ? result.remaining : 0,
    limit: result?.limit !== undefined ? result.limit : 0,
  };
}

export const limitRouter = t.router({
  getMinutesLeft: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    if (!userId) return { remaining: 0, limit: 0 };
    const result = await getMinutesLeft(userId);
    return extractLimitResult(result);
  }),
  getTransformationsLeft: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    if (!userId) return { remaining: 0, limit: 0 };
    const result = await getTransformationsLeft(userId);
    return extractLimitResult(result);
  }),
});
