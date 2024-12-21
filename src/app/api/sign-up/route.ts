import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, email, password } = await request.json();

    const existingVerifiedUserByUsername = await UserModel.findOne({
      username: username,
      isVerified: true,
    });

    if (existingVerifiedUserByUsername) {
      return Response.json(
        { message: "username is taken", success: "false" },
        { status: 400 }
      );
    }

    const existingUserByEmail = await UserModel.findOne({ email });
    let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return Response.json(
          { message: "user already exists with this email", success: "false" },
          { status: 400 }
        );
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);
        await existingUserByEmail.save();
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const expirtyDate = new Date();
      expirtyDate.setHours(expirtyDate.getHours() + 1);

      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode: verifyCode,
        verifyCodeExpiry: expirtyDate,
        isVerified: false,
        notes: [],
      });

      await newUser.save();
    }

    const emailResponse = await sendVerificationEmail(
      username,
      password,
      verifyCode
    );

    if(emailResponse.success){
      return Response.json(
        {
          success: true,
          message: "User registered successfully. Please verify your account.",
        },
        { status: 201 }
      );
    }

    if (!emailResponse.success) {
      return Response.json(
        {
          success: false,
          message: emailResponse.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error signing up", error);
    return Response.json(
      { message: "Error signing in", success: "false" },
      { status: 500 }
    );
  }
}
