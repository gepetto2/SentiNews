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

export default function RegionModal({
  selectedName,
  selectedTemp,
  selectedNews,
  onClose,
}) {
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
          <Typography variant="body2" color="text.secondary">
            Temperatura nastrojów:
          </Typography>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: getColorForTemperature(selectedTemp) }}
          >
            {selectedTemp !== null && selectedTemp !== undefined
              ? selectedTemp.toFixed(2)
              : "Brak danych"}
          </Typography>
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
