export async function GET() {
  const data = {
    applinks: {
      apps: [],
      details: [
        {
          appID: "87JU824B26.com.elamirizidani.igiheapp",
          paths: ["/*"],
        },
      ],
    },
  };

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}