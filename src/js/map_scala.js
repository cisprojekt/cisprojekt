function mapPreview() {
  let offsetWid = document.documentElement.clientWidth;
  let offsetHei = document.documentElement.clientHeight;
  let scaFactor = Math.min((offsetWid * 0.75) / 1330, (offsetHei * 0.75) / 760);
  console.log(scaFactor);
  return scaFactor;
}