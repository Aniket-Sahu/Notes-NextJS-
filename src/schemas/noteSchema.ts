import { z } from "zod";

export const noteSchema = z.object({
    title: z.string().min(2, "title can not be less than 2 characters").max(30,"title can not be more than 30 characters"),
    content: z.string().min(2, "content can not be less than 2 characters").max(10000,"content can not be more than 30 characters"),
});