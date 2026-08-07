/**
 * Supabase Edge Function: generate-image
 *
 * 调用 Replicate API 生成 AI 场景图片
 * 保护 API Key 不暴露给客户端
 *
 * 部署: supabase functions deploy generate-image
 */

import "jsr:@std/http/response";

const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN") ?? "";
const REPLICATE_MODEL = "black-forest-labs/flux-schnell";

interface GenerateRequest {
  prompt: string;
  scenario_id?: string;
  width?: number;
  height?: number;
}

interface ReplicateResponse {
  id: string;
  output: string[];
  status: string;
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // 鉴权
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "缺少认证" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const body: GenerateRequest = await req.json();

    if (!body.prompt || body.prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "prompt 不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    console.log(`🎨 生成图片: ${body.prompt.substring(0, 80)}...`);

    // 调用 Replicate API
    const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: REPLICATE_MODEL,
        input: {
          prompt: `${body.prompt}, high quality, 4K, cinematic lighting, modern illustration style`,
          width: body.width ?? 1024,
          height: body.height ?? 768,
          num_outputs: 1,
        },
      }),
    });

    if (!replicateResponse.ok) {
      const err = await replicateResponse.text();
      console.error(`Replicate API 错误: ${err}`);
      return new Response(JSON.stringify({ error: "图片生成失败" }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const prediction: ReplicateResponse = await replicateResponse.json();

    // Replicate 返回的是一个 prediction，需要等待完成
    // 对于 flux-schnell，通常是同步完成的
    const imageUrl = prediction.output?.[0];

    if (!imageUrl) {
      return new Response(JSON.stringify({
        status: "processing",
        prediction_id: prediction.id,
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response(JSON.stringify({
      status: "completed",
      image_url: imageUrl,
      model: REPLICATE_MODEL,
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (error) {
    console.error(`生成图片异常: ${error}`);
    return new Response(JSON.stringify({ error: "服务器内部错误" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
