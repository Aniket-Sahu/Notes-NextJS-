import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { getServerSession } from "next-auth/next";
import { User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function DELETE(
  request: Request,
  { params }: { params: { noteid: string } }
) {
  const noteId = params.noteid;
  await dbConnect();
  const session = await getServerSession(authOptions);
  const user: User = session?.user;
  if (!session || !user) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const updateResult = await UserModel.updateOne(
      { _id: user._id },
      { $pull: { notes: { _id: noteId } } }
    );

    if (updateResult.modifiedCount === 0) {
      return Response.json(
        { message: "note not found or already deleted", success: "false" },
        { status: 404 }
      );
    }

    return Response.json(
      { message: "Note found and deleted", success: "true" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting message:", error);
    return Response.json(
      { message: "Error deleting message", success: false },
      { status: 500 }
    );
  }
}
