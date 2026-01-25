import { Card, CardContent, Link, Typography } from "@mui/material";
import chroma from "chroma-js";
import { getColorForTemperature } from "../utils/colors";

export default function NewsCardSmall({ news }) {
  const sentimentColor = getColorForTemperature(news.temperature);
  const textColor = chroma(sentimentColor).luminance() > 0.4 ? "#000" : "#fff";

  return (
    <Card variant="outlined" sx={{ bgcolor: sentimentColor, border: "none" }}>
      <CardContent
        sx={{
          p: "10px 14px !important",
          "&:last-child": { pb: "10px !important" },
        }}
      >
        <Link
          href={news.link}
          target="_blank"
          rel="noopener"
          underline="hover"
          sx={{ color: textColor, display: "block" }}
        >
          <Typography
            variant="body2"
            fontWeight={500}
            sx={{ color: textColor }}
          >
            {news.title}
          </Typography>
        </Link>
        {news.domain && (
          <Typography
            variant="caption"
            sx={{ color: textColor, opacity: 0.8, display: "block", mt: 0.5 }}
          >
            Źródło: {news.domain}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
