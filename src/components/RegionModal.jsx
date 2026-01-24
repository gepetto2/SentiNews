import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { getColorForTemperature } from "../utils/colors";
import NewsCardSmall from "./NewsCardSmall";
import chroma from "chroma-js";

export default function RegionModal({
  selectedName,
  selectedTemp,
  selectedNews,
  onClose,
}) {
  const hasTemp = selectedTemp !== null && selectedTemp !== undefined;
  const tempColor = getColorForTemperature(selectedTemp);
  const textColor = hasTemp
    ? chroma(tempColor).luminance() > 0.4
      ? "#000"
      : "#fff"
    : "inherit";
  return (
    <Dialog
      open={!!selectedName}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        style: { borderRadius: 14, padding: 8 },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          {selectedName}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box textAlign="center" mb={3}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Temperatura nastrojów (od -10 do 10):
          </Typography>
          {hasTemp ? (
            <Box
              sx={{
                display: "inline-block",
                bgcolor: tempColor,
                color: textColor,
                px: 2,
                py: 0.5,
                borderRadius: "12px",
              }}
            >
              <Typography variant="h5" fontWeight={700} component="span">
                {(selectedTemp*10).toFixed(2)}
              </Typography>
            </Box>
          ) : (
            <Typography variant="h5" fontWeight={700} color="text.secondary">
              Brak danych
            </Typography>
          )}
        </Box>

        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Najważniejsze newsy:
        </Typography>

        <Box display="flex" flexDirection="column" gap={1}>
          {selectedNews && selectedNews.length > 0 ? (
            selectedNews.map((news, i) => <NewsCardSmall key={i} news={news} />)
          ) : (
            <Typography variant="caption" color="text.secondary" align="center">
              Brak wyróżnionych newsów.
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
