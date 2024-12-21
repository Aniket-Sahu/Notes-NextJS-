"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Note, User } from "@/model/User";
import { noteSchema } from "@/schemas/noteSchema";
import { ApiResponse } from "@/types/ApiResponse";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { Loader2, RefreshCcw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

function UserDashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);

  const { toast } = useToast();
  const { data: session } = useSession();

  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const username = session?.user?.username;

  if (!username) {
    return <div>Please log in to access your dashboard</div>;
  }

  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const profileUrl = `${baseUrl}/u/${username}`;

  const handleDeleteNote = async (noteId: string) => {
    setNotes(notes.filter((note) => note._id !== noteId));
    try {
      const response = await axios.delete(`/api/delete-note/${noteId}`);
      toast({
        title: "Success",
        description: response.data.message
      });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data.message ?? "Failed to fetch notes",
        variant: "destructive",
      });
    }
  };

  const { register, watch, setValue } = form;

  const fetchNotes = useCallback(
    async (refresh: boolean = false) => {
      setIsLoading(true);
      try {
        const response = await axios.get<ApiResponse>("/api/get-notes");
        setNotes(response.data.notes || []);
        if (refresh) {
          toast({
            title: "Refreshed Notes",
            description: "Showing latest notes",
          });
        }
      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        toast({
          title: "Error",
          description:
            axiosError.response?.data.message ?? "Failed to fetch notes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, setNotes, toast]
  );

  const onSubmit = async (note: z.infer<typeof noteSchema>) => {
    try {
      const noteWithUsername = {
        username: username,
        ...note,
      };
      console.log("adding note");
      const response = await axios.post("/api/post-note", noteWithUsername);
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchNotes();
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      const errorMessage =
        axiosError.response?.data.message ?? "Note addition failed";
      toast({
        title: "Note addition failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!session || !session.user) return;
    fetchNotes();
  }, [session, toast, fetchNotes]);

  if (!session || !session.user) {
    return <div>Please Log In</div>;
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: "URL Copied!",
      description: "Profile URL has been copied to clipboard.",
    });
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-4xl font-bold mb-4">User Dashboard</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Copy Your Unique Link</h2>
        <div className="flex items-center">
          <input
            type="text"
            value={profileUrl}
            disabled
            className="input input-bordered w-full p-2 mr-2"
          />
          <Button onClick={copyToClipboard}>Copy</Button>
        </div>
      </div>

      <Separator />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4">Add Note</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Add New Note</DialogTitle>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                name="title"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <Input placeholder="Enter Note's title" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="content"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <Input placeholder="Enter Note's content" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                className="w-full"
                type="submit"
                onClick={() => setIsOpen(false)}
              >
                Add
              </Button>
            </form>
          </Form>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogContent>
      </Dialog>

      <div className="mt-6">
        {notes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note, index) => (
              <div
                key={index}
                className="relative p-4 border rounded-md shadow-sm bg-white hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => handleDeleteNote(note._id as string)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  &#10005;
                </button>
                <h3 className="text-lg font-bold mb-2">{note.title}</h3>
                <p className="text-sm text-gray-700">{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No notes to display.</p>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
