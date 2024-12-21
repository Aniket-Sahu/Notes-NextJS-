import { z } from "zod";
import { usernameValidation } from "./signUpSchema";

export const UsernameQuerySchema = z.object({
    username: usernameValidation,
});