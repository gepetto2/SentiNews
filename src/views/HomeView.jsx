import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import ListAltIcon from "@mui/icons-material/ListAlt";

export default function HomeView() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: ["100vh", "100dvh"],
        overflow: "hidden",
        bgcolor: "#f3f4f6",
        p: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            fontWeight={800}
            color="primary"
            gutterBottom
          >
            SentiNews
          </Typography>

          <Stack spacing={2} sx={{ width: "100%", maxWidth: 320 }}>
            <Button
              component={Link}
              to="/map"
              variant="contained"
              size="large"
              fullWidth
              startIcon={<MapIcon />}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              Mapa
            </Button>
            <Button
              component={Link}
              to="/news"
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<ListAltIcon />}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                bgcolor: "white",
              }}
            >
              Newsy
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
