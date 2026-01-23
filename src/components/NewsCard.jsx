import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Stack,
  Chip,
} from "@mui/material";
import { getColorForTemperature } from "../utils/colors";

export default function NewsCard({ item }) {
  const tempColor = getColorForTemperature(item.temperature);
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
            sx={{ mb: 2 }}
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
            {item.region && <Chip label={`📍 ${item.region}`} size="small" />}
            {item.category && (
              <Chip
                label={item.category}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
            <Chip
              label={`Temp: ${item.temperature !== undefined ? Number(item.temperature).toFixed(2) : "-"}`}
              size="small"
              sx={{ bgcolor: tempColor, color: "#fff", fontWeight: "bold" }}
            />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
