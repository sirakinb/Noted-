import { t, protectedProcedure } from "../init";
import { getMinutesLeft, getTransformationsLeft } from "../../lib/limits";

function extractLimitResult(result: any) {
  return {
    remaining:
      typeof result.remaining === "number" ? Number(result.remaining) : 0,
    limit: typeof result.limit === "number" ? Number(result.limit) : 0,
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
