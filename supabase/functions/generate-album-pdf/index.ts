import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ParticipantData {
  id: string;
  fullName: string;
  departmentOrClass?: string;
  identifier?: string;
  photoUrl: string;
}

interface AlbumData {
  id: string;
  title: string;
  institutionName?: string;
  albumType: string;
  year: string;
}

const ALBUM_TYPE_LABELS: Record<string, string> = {
  class: "Class Album",
  department: "Department Album",
  faculty: "Faculty Album",
  training: "Training Album",
  bootcamp: "Bootcamp Album",
  other: "Album",
};

// A4 dimensions in points (72 points per inch)
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const PHOTO_SIZE = 100;
const CARD_WIDTH = 160;
const CARD_HEIGHT = 180;
const COLS = 3;
const ROWS = 4;

async function fetchImageAsBytes(url: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error("Failed to fetch image:", url, error);
    return null;
  }
}

async function createCoverPage(
  pdfDoc: PDFDocument,
  album: AlbumData,
  participantCount: number
) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const centerX = PAGE_WIDTH / 2;

  // Institution name
  if (album.institutionName) {
    page.drawText(album.institutionName.toUpperCase(), {
      x: centerX - helvetica.widthOfTextAtSize(album.institutionName.toUpperCase(), 12) / 2,
      y: PAGE_HEIGHT - 200,
      size: 12,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Title
  const titleSize = 32;
  const titleWidth = helveticaBold.widthOfTextAtSize(album.title, titleSize);
  page.drawText(album.title, {
    x: centerX - titleWidth / 2,
    y: PAGE_HEIGHT - 280,
    size: titleSize,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Album type
  const typeLabel = ALBUM_TYPE_LABELS[album.albumType] || album.albumType;
  page.drawText(typeLabel, {
    x: centerX - helvetica.widthOfTextAtSize(typeLabel, 16) / 2,
    y: PAGE_HEIGHT - 320,
    size: 16,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Decorative line
  page.drawLine({
    start: { x: centerX - 50, y: PAGE_HEIGHT - 360 },
    end: { x: centerX + 50, y: PAGE_HEIGHT - 360 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Year
  page.drawText(album.year, {
    x: centerX - helveticaBold.widthOfTextAtSize(album.year, 28) / 2,
    y: PAGE_HEIGHT - 420,
    size: 28,
    font: helveticaBold,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Participant count
  const countText = `${participantCount} Participant${participantCount !== 1 ? "s" : ""}`;
  page.drawText(countText, {
    x: centerX - helvetica.widthOfTextAtSize(countText, 12) / 2,
    y: PAGE_HEIGHT - 500,
    size: 12,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  return page;
}

async function createParticipantPages(
  pdfDoc: PDFDocument,
  participants: ParticipantData[]
) {
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const participantsPerPage = COLS * ROWS;
  const totalPages = Math.ceil(participants.length / participantsPerPage);

  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const pageParticipants = participants.slice(
      pageNum * participantsPerPage,
      (pageNum + 1) * participantsPerPage
    );

    // Page header
    page.drawText("PARTICIPANTS", {
      x: MARGIN,
      y: PAGE_HEIGHT - 40,
      size: 10,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pageText = `Page ${pageNum + 1} of ${totalPages}`;
    page.drawText(pageText, {
      x: PAGE_WIDTH - MARGIN - helvetica.widthOfTextAtSize(pageText, 10),
      y: PAGE_HEIGHT - 40,
      size: 10,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Draw separator line
    page.drawLine({
      start: { x: MARGIN, y: PAGE_HEIGHT - 55 },
      end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 55 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Grid layout
    const gridStartY = PAGE_HEIGHT - 80;
    const gridStartX = MARGIN;
    const cardSpacingX = (PAGE_WIDTH - 2 * MARGIN) / COLS;
    const cardSpacingY = (gridStartY - MARGIN) / ROWS;

    for (let i = 0; i < pageParticipants.length; i++) {
      const participant = pageParticipants[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);

      const cardX = gridStartX + col * cardSpacingX + (cardSpacingX - CARD_WIDTH) / 2;
      const cardY = gridStartY - row * cardSpacingY - CARD_HEIGHT;

      // Try to embed photo
      const photoUrl = participant.photoUrl;
      if (photoUrl) {
        try {
          const imageBytes = await fetchImageAsBytes(photoUrl);
          if (imageBytes) {
            let image;
            // Try JPEG first, then PNG
            try {
              image = await pdfDoc.embedJpg(imageBytes);
            } catch {
              try {
                image = await pdfDoc.embedPng(imageBytes);
              } catch (e) {
                console.error("Could not embed image:", e);
              }
            }

            if (image) {
              const imgDims = image.scaleToFit(PHOTO_SIZE, PHOTO_SIZE);
              page.drawImage(image, {
                x: cardX + (CARD_WIDTH - imgDims.width) / 2,
                y: cardY + CARD_HEIGHT - imgDims.height - 10,
                width: imgDims.width,
                height: imgDims.height,
              });
            }
          }
        } catch (e) {
          console.error("Failed to process image:", e);
        }
      }

      // Draw placeholder rectangle if no image
      page.drawRectangle({
        x: cardX + (CARD_WIDTH - PHOTO_SIZE) / 2,
        y: cardY + CARD_HEIGHT - PHOTO_SIZE - 10,
        width: PHOTO_SIZE,
        height: PHOTO_SIZE,
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 1,
      });

      // Name (truncate if too long)
      let displayName = participant.fullName;
      const maxNameWidth = CARD_WIDTH - 10;
      while (helveticaBold.widthOfTextAtSize(displayName, 10) > maxNameWidth && displayName.length > 0) {
        displayName = displayName.slice(0, -1);
      }
      if (displayName !== participant.fullName) {
        displayName = displayName.slice(0, -2) + "...";
      }

      const nameWidth = helveticaBold.widthOfTextAtSize(displayName, 10);
      page.drawText(displayName, {
        x: cardX + (CARD_WIDTH - nameWidth) / 2,
        y: cardY + 45,
        size: 10,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      // Department/Class
      if (participant.departmentOrClass) {
        let dept = participant.departmentOrClass;
        while (helvetica.widthOfTextAtSize(dept, 9) > maxNameWidth && dept.length > 0) {
          dept = dept.slice(0, -1);
        }
        if (dept !== participant.departmentOrClass) {
          dept = dept.slice(0, -2) + "...";
        }
        const deptWidth = helvetica.widthOfTextAtSize(dept, 9);
        page.drawText(dept, {
          x: cardX + (CARD_WIDTH - deptWidth) / 2,
          y: cardY + 28,
          size: 9,
          font: helvetica,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      // Identifier
      if (participant.identifier) {
        const idText = `#${participant.identifier}`;
        const idWidth = helvetica.widthOfTextAtSize(idText, 8);
        page.drawText(idText, {
          x: cardX + (CARD_WIDTH - idWidth) / 2,
          y: cardY + 12,
          size: 8,
          font: helvetica,
          color: rgb(0.6, 0.6, 0.6),
        });
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from request
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { albumId, generationId, templateId = "classic" } = await req.json();

    if (!albumId || !generationId) {
      return new Response(
        JSON.stringify({ error: "albumId and generationId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update generation status to 'generating'
    await supabase
      .from("album_generations")
      .update({ status: "generating" })
      .eq("id", generationId);

    // Fetch album data
    const { data: album, error: albumError } = await supabase
      .from("albums")
      .select("*")
      .eq("id", albumId)
      .single();

    if (albumError || !album) {
      await supabase
        .from("album_generations")
        .update({ status: "failed", error_message: "Album not found" })
        .eq("id", generationId);
      return new Response(
        JSON.stringify({ error: "Album not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate album is locked
    if (!album.is_locked) {
      await supabase
        .from("album_generations")
        .update({ status: "failed", error_message: "Album must be locked before generation" })
        .eq("id", generationId);
      return new Response(
        JSON.stringify({ error: "Album must be locked before generation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch approved submissions with participants
    const { data: submissions, error: subError } = await supabase
      .from("submissions")
      .select(`
        *,
        participant:participants(*)
      `)
      .eq("album_id", albumId)
      .eq("approval_status", "approved")
      .order("submitted_at", { ascending: true });

    if (subError) {
      await supabase
        .from("album_generations")
        .update({ status: "failed", error_message: "Failed to fetch submissions" })
        .eq("id", generationId);
      return new Response(
        JSON.stringify({ error: "Failed to fetch submissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter for paid submissions if participant_pays mode
    let eligibleSubmissions = submissions || [];
    if (album.payment_mode === "participant_pays") {
      eligibleSubmissions = eligibleSubmissions.filter(
        (sub: any) => sub.payment_status === "successful"
      );
    }

    if (eligibleSubmissions.length === 0) {
      await supabase
        .from("album_generations")
        .update({ 
          status: "failed", 
          error_message: "No eligible submissions (must be approved and paid)" 
        })
        .eq("id", generationId);
      return new Response(
        JSON.stringify({ error: "No eligible submissions" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sort by name
    eligibleSubmissions.sort((a: any, b: any) => {
      const nameA = a.participant?.full_name || "";
      const nameB = b.participant?.full_name || "";
      return nameA.localeCompare(nameB);
    });

    // Transform to participant data
    const participants: ParticipantData[] = eligibleSubmissions.map((sub: any) => ({
      id: sub.id,
      fullName: sub.participant?.full_name || "Unknown",
      departmentOrClass: sub.participant?.department_or_class || undefined,
      identifier: sub.participant?.identifier || undefined,
      photoUrl: sub.processed_photo_url || sub.photo_url,
    }));

    // Create PDF
    const pdfDoc = await PDFDocument.create();

    const albumData: AlbumData = {
      id: album.id,
      title: album.title,
      institutionName: album.institution_name || undefined,
      albumType: album.album_type,
      year: new Date().getFullYear().toString(),
    };

    // Create cover page
    await createCoverPage(pdfDoc, albumData, participants.length);

    // Create participant pages
    await createParticipantPages(pdfDoc, participants);

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const pdfSize = pdfBytes.length;

    // Upload to storage
    const fileName = `${albumId}/${generationId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("album-pdfs")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      await supabase
        .from("album_generations")
        .update({ status: "failed", error_message: "Failed to upload PDF" })
        .eq("id", generationId);
      return new Response(
        JSON.stringify({ error: "Failed to upload PDF" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update generation record
    await supabase
      .from("album_generations")
      .update({
        status: "completed",
        file_path: fileName,
        file_size_bytes: pdfSize,
        participant_count: participants.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", generationId);

    return new Response(
      JSON.stringify({
        success: true,
        filePath: fileName,
        fileSize: pdfSize,
        participantCount: participants.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Generation failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
