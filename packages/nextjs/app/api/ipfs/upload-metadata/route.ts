import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, image, attributes } = body;

    const metadata = {
      name,
      description,
      image,
      attributes,
    };

    const pinataBody = {
      pinataContent: metadata,
      pinataMetadata: {
        name: `${name.replace(/\s/g, "_")}_metadata.json`,
      },
    };

    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify(pinataBody),
    });

    const resData = await res.json();

    if (!res.ok) {
      throw new Error(resData.error || "Pinata metadata upload failed");
    }

    return NextResponse.json({ ipfsHash: resData.IpfsHash, tokenURI: `ipfs://${resData.IpfsHash}` }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
