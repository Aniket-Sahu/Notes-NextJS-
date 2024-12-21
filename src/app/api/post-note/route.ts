import dbConnect from "@/lib/dbConnect";
import UserModel, { Note } from "@/model/User";

export async function POST(request: Request) {
    await dbConnect();
    const {username, title, content} = await request.json();

    try {
        const user = await UserModel.findOne({username}).exec();

        if (!user) {
            return Response.json(
              { message: 'User not found', success: false },
              { status: 404 }
            );
        }

        const newNote = {title, content, createdAt: new Date()};
        user.notes.push(newNote as Note);
        await user.save();

        return Response.json(
            { message: 'Note saved successfully', success: true },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error adding message:', error);
        return Response.json(
        { message: 'Internal server error', success: false },
        { status: 500 }
        );
    }
}