import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import Button from "../components/common/Button.jsx";
import Loader from "../components/common/Loader.jsx";
import InvoiceTemplate from "../components/invoice/InvoiceTemplate.jsx";
import { getInvoicePrintData, invoicePdfUrl } from "../api/invoiceApi.js";
import { openPdfUrl } from "../utils/pdfWindow.js";

export default function InvoicePrintPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ["invoice-print-data", id], queryFn: () => getInvoicePrintData(id) });
  if (isLoading) return <Loader />;
  return (
    <main className="print-page">
      <div className="print-toolbar"><Button onClick={() => openPdfUrl(invoicePdfUrl(id))}>Print PDF</Button></div>
      <InvoiceTemplate invoice={data?.invoice} company={data?.company} />
    </main>
  );
}
