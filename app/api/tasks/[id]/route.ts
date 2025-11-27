import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import jwt from "jsonwebtoken";

// 获取用户 ID
function getUserIdFromToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// PATCH: 更新任务状态（pause/resume）
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON" },
      { status: 400 }
    );
  }

  const { status } = body;
  const { id: taskId } = await params;

  if (!status || !["Running", "Paused"].includes(status)) {
    return NextResponse.json(
      { success: false, message: "Invalid status. Must be 'Running' or 'Paused'" },
      { status: 400 }
    );
  }

  try {
    // 首先验证任务属于该用户
    const { data: existingTask, error: fetchError } = await supabaseAdmin
      .from("tasks")
      .select("id, user_id, status")
      .eq("id", taskId)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    if (existingTask.user_id !== userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // 更新任务状态
    const { data: task, error } = await supabaseAdmin
      .from("tasks")
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", taskId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating task:", error);
      return NextResponse.json(
        { success: false, message: "Failed to update task" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Error in PATCH /api/tasks/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: 删除任务
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id: taskId } = await params;

  try {
    // 首先验证任务属于该用户
    const { data: existingTask, error: fetchError } = await supabaseAdmin
      .from("tasks")
      .select("id, user_id")
      .eq("id", taskId)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    if (existingTask.user_id !== userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // 删除任务（或者更新状态为 Deleted，取决于你的业务逻辑）
    // 这里我选择直接删除，如果你想要软删除，可以改为更新状态
    const { error } = await supabaseAdmin
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting task:", error);
      return NextResponse.json(
        { success: false, message: "Failed to delete task" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/tasks/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

