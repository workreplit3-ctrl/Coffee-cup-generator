import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "cupart — AI-дизайн для кофейных стаканов",
  description:
    "cupart генерирует уникальный дизайн для стаканов кофейни за секунды. Live-превью в 3D, экспорт в высоком разрешении, готово к печати.",
  openGraph: {
    title: "cupart — AI-дизайн для кофейных стаканов",
    description:
      "Сгенерируй фирменный стакан за секунды. Live-превью и печатный файл в 4K.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="grain">{children}</body>
    </html>
  );
}
