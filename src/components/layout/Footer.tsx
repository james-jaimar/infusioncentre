const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary py-6">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground">
          © {currentYear} Gayle Heydenrych. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
