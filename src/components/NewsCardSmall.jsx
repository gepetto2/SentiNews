import { Card, CardContent, Link, Typography } from "@mui/material";

export default function NewsCardSmall({ news }) {
  return (
    <Card variant="outlined" sx={{ bgcolor: "#f9fafb" }}>
      <CardContent
        sx={{ p: "12px !important", "&:last-child": { pb: "12px !important" } }}
      >
        <Link
          href={news.link}
          target="_blank"
          rel="noopener"
          underline="hover"
          color="text.primary"
        >
          <Typography variant="body2" fontWeight={500}>
            {news.title}
          </Typography>
        </Link>
      </CardContent>
    </Card>
  );
}
