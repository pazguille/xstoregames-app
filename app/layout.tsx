export const metadata = {
  title: 'XStore: La tienda de Xbox Argentina con impuestos incluidos',
  description: 'Explora la amplia colección de títulos de videojuegos en el catálogo de juegos de Xbox en precios argentinos.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
