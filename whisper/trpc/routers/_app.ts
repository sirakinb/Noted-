import { t } from "../init";
import { z } from "zod";
import { whisperRouter } from "./whisper";
import { limitRouter } from "./limit";

export const appRouter = t.router({
  hello: t.procedure
    .input(z.object({ text: z.string().optional() }))
    .query(({ input }) => {
      return { greeting: `Hello, ${input?.text ?? "world"}!` };
    }),
  whisper: whisperRouter,
  limit: limitRouter,
});

export type AppRouter = typeof appRouter;
