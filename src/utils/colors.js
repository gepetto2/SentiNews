import chroma from "chroma-js";

const colorScale = chroma
  .scale([
    "#d73027",
    "#f46d43",
    "#fdae61",
    "#fee08b",
    "#ffffbf",
    "#d9ef8b",
    "#a6d96a",
    "#66bd63",
    "#1a9850",
  ])
  .domain([-1, 0, 1])
  .mode("lrgb");

export const getColorForTemperature = (temp) => {
  if (temp === undefined || temp === null) return "#e5e7eb";
  return colorScale(temp).hex();
};
