import { t, protectedProcedure } from "../init";
import { getMinutesLeft, getTransformationsLeft } from "../../lib/limits";

function extractLimitResult(result: any) {
  // Only extract the properties we need to avoid React hydration issues
  // Preserve null values for unlimited plans and don't default to 0 unnecessarily
  return {
    remaining: result?.remaining !== undefined ? result.remaining : (result?.remaining === null ? null : 0),
    limit: result?.limit !== undefined ? result.limit : (result?.limit === null ? null : 0),
  };
}

export const limitRouter = t.router({
  getMinutesLeft: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    if (!userId) return { remaining: 0, limit: 0 };
    
    console.log('Getting minutes left for user:', userId);
    const result = await getMinutesLeft(userId);
    console.log('Minutes result:', result);
    
    const extracted = extractLimitResult(result);
    console.log('Extracted minutes result:', extracted);
    
    return extracted;
  }),
  getTransformationsLeft: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    if (!userId) return { remaining: 0, limit: 0 };
    
    console.log('Getting transformations left for user:', userId);
    const result = await getTransformationsLeft(userId);
    console.log('Transformations result:', result);
    
    const extracted = extractLimitResult(result);
    console.log('Extracted transformations result:', extracted);
    
    return extracted;
  }),
});
