import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get("file");
    const metadata = data.get("metadata");

    // Check for Pinata JWT
    const pinataJWT = process.env.PINATA_JWT;
    if (!pinataJWT) {
      return NextResponse.json({ error: "Pinata JWT not found in server environment" }, { status: 500 });
    }

    if (file) {
      // Handle File Upload
      const formData = new FormData();
      formData.append("file", file);

      const pinataMetadata = JSON.stringify({
        name: (file as File).name,
      });
      formData.append("pinataMetadata", pinataMetadata);

      const pinataOptions = JSON.stringify({
        cidVersion: 0,
      });
      formData.append("pinataOptions", pinataOptions);

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJWT}`,
        },
        body: formData,
      });

      const resData = await res.json();

      if (!res.ok) {
        return NextResponse.json({ error: resData.error || "Failed to upload to Pinata" }, { status: res.status });
      }

      return NextResponse.json(resData, { status: 200 });
    } else if (metadata) {
      // Handle JSON Metadata Upload
      // metadata should be a stringified JSON object
      const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pinataJWT}`,
        },
        body: metadata,
      });

      const resData = await res.json();

      if (!res.ok) {
        return NextResponse.json(
          { error: resData.error || "Failed to upload metadata to Pinata" },
          { status: res.status },
        );
      }

      return NextResponse.json(resData, { status: 200 });
    } else {
      return NextResponse.json({ error: "No file or metadata found" }, { status: 400 });
    }
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
