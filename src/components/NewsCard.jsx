import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Stack,
  Chip,
} from "@mui/material";
import chroma from "chroma-js";
import { getColorForTemperature } from "../utils/colors";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";

export default function NewsCard({ item }) {
  const tempColor = getColorForTemperature(item.temperature);
  const textColor = chroma(tempColor).luminance() > 0.4 ? "#000" : "#fff";

  const formattedDate = item.published
    ? new Date(item.published).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  return (
    <Card
      sx={{
        borderRadius: 3,
        transition: "0.2s",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
      }}
    >
      <CardActionArea href={item.link} target="_blank" rel="noopener">
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {item.title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            paragraph
            sx={{
              mb: 2,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              overflow: "hidden",
            }}
          >
            {item.summary}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ gap: 1 }}
          >
            {item.sentiment_label && (
              <Chip
                label={item.sentiment_label}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {item.region && (
              <Chip
                icon={<LocationOnIcon />}
                label={item.region}
                size="small"
              />
            )}
            {formattedDate && (
              <Chip icon={<EventIcon />} label={formattedDate} size="small" />
            )}
            {item.category && (
              <Chip
                label={item.category}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
            <Chip
              label={`Temp: ${item.temperature !== undefined ? Number(item.temperature*10).toFixed(2) : "-"}`}
              size="small"
              sx={{ bgcolor: tempColor, color: textColor, fontWeight: "bold" }}
            />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
