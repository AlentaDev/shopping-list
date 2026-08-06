import { UI_TEXT } from "@src/shared/constants/ui";

type AppFooterProps = {
  contentLayout?: "default" | "catalog";
};

export const AppFooter = ({ contentLayout = "default" }: AppFooterProps) => {
  const isCatalogLayout = contentLayout === "catalog";
  const footerCopy = (
    <div
      data-testid="app-footer-copy"
      className={
        isCatalogLayout
          ? "md:flex md:items-start md:justify-center"
          : "flex justify-center"
      }
    >
      <div data-testid="app-footer-copy-inner" className="space-y-1 text-left">
        <p className="font-medium text-slate-900">{UI_TEXT.FOOTER.TAGLINE}</p>
        <p className="pl-4">{UI_TEXT.FOOTER.SUPPORTING_COPY}</p>
        <p className="pl-4">{UI_TEXT.FOOTER.COPYRIGHT}</p>
      </div>
    </div>
  );

  return (
    <footer data-testid="app-footer" className="w-full">
      {isCatalogLayout ? (
        <div data-testid="app-footer-shell" className="mx-auto w-full max-w-7xl">
          <div data-testid="app-footer-region" className="md:ml-85">
            <div
              data-testid="app-footer-catalog-column"
              className="border-t border-slate-200 bg-white"
            >
              <div
                data-testid="app-footer-content"
                className="w-full px-4 py-8 text-sm text-slate-600"
              >
                {footerCopy}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div data-testid="app-footer-region" className="border-t border-slate-200 bg-white">
          <div
            data-testid="app-footer-content"
            className="mx-auto w-full max-w-7xl px-4 py-8 text-sm text-slate-600"
          >
            {footerCopy}
          </div>
        </div>
      )}
    </footer>
  );
};
