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

// GET: 获取所有任务
export async function GET(request: Request) {
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { data: tasks, error } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
      return NextResponse.json(
        { success: false, message: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, tasks: tasks || [] });
  } catch (error) {
    console.error("Error in GET /api/tasks:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: 创建新任务
export async function POST(request: Request) {
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

  const { taskName, listFile, proxiesFile, selectedMachine, selectedThreads, selectedTimeout, startFrom } = body;

  if (!taskName || !listFile) {
    return NextResponse.json(
      { success: false, message: "Task name and list file are required" },
      { status: 400 }
    );
  }

  try {
    // 生成任务 ID
    const taskId = `T-${Date.now().toString().slice(-6)}`;
    
    // 创建任务
    const { data: task, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        user_id: userId,
        task_id: taskId,
        title: taskName,
        list_file: listFile.name || listFile,
        proxies_file: proxiesFile?.name || null,
        machine_id: selectedMachine?.id || null,
        machine_name: selectedMachine?.name || null,
        machine_ip: selectedMachine?.ip || null,
        threads: selectedThreads || 50,
        timeout: selectedTimeout || "5s",
        start_from: startFrom || null,
        status: "Running",
        progress: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating task:", error);
      return NextResponse.json(
        { success: false, message: "Failed to create task" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Error in POST /api/tasks:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}




