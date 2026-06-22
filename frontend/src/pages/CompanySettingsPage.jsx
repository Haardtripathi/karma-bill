import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import Textarea from "../components/common/Textarea.jsx";
import Select from "../components/common/Select.jsx";
import FileUpload from "../components/common/FileUpload.jsx";
import ImagePreview from "../components/common/ImagePreview.jsx";
import Loader from "../components/common/Loader.jsx";
import { getCompanySettings, updateCompanySettings, uploadCompanyLogo, uploadCompanyPaymentQr, uploadCompanySignature } from "../api/companySettingApi.js";

const defaultForm = {
  businessName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  email: "",
  mapsLink: "",
  defaultTerms: "",
  defaultPaymentMode: "Cash",
  upiId: "",
  bankAccountName: "",
  bankName: "",
  bankAccountNumber: "",
  bankIfsc: "",
  bankBranch: "",
  invoicePrefix: "KA"
};

export default function CompanySettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["company-settings"], queryFn: getCompanySettings });
  const [form, setForm] = useState(defaultForm);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (data && !isInitialized) {
      setForm(data);
      setIsInitialized(true);
    }
  }, [data, isInitialized]);

  const saveMutation = useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: (updatedData) => {
      toast.success("Company settings saved");
      queryClient.setQueryData(["company-settings"], updatedData);
    }
  });

  const logoMutation = useMutation({
    mutationFn: uploadCompanyLogo,
    onSuccess: (updatedData) => {
      queryClient.setQueryData(["company-settings"], updatedData);
      setForm((current) => ({
        ...current,
        logoUrl: updatedData.logoUrl,
        logoPublicId: updatedData.logoPublicId
      }));
      toast.success("Logo uploaded successfully");
    }
  });

  const signatureMutation = useMutation({
    mutationFn: uploadCompanySignature,
    onSuccess: (updatedData) => {
      queryClient.setQueryData(["company-settings"], updatedData);
      setForm((current) => ({
        ...current,
        signatureImageUrl: updatedData.signatureImageUrl,
        signaturePublicId: updatedData.signaturePublicId
      }));
      toast.success("Signature uploaded successfully");
    }
  });

  const paymentQrMutation = useMutation({
    mutationFn: uploadCompanyPaymentQr,
    onSuccess: (updatedData) => {
      queryClient.setQueryData(["company-settings"], updatedData);
      setForm((current) => ({
        ...current,
        paymentQrUrl: updatedData.paymentQrUrl,
        paymentQrPublicId: updatedData.paymentQrPublicId
      }));
      toast.success("Payment QR uploaded successfully");
    }
  });

  if (isLoading) return <Loader label="Loading company settings..." />;
  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  return (
    <section className="page">
      <div className="page-header"><div><h2>Company Settings</h2><p>Business details used on every invoice.</p></div></div>
      <form className="panel page" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(form); }}>
        <div className="panel-section">
          <div className="section-heading"><h2>Business Details</h2></div>
          <div className="form-grid two">
            <Input label="Business name" value={form.businessName || ""} onChange={(event) => set({ businessName: event.target.value })} />
            <Input label="Invoice prefix" value={form.invoicePrefix || ""} onChange={(event) => set({ invoicePrefix: event.target.value })} />
            <Input label="Address line 1" value={form.addressLine1 || ""} onChange={(event) => set({ addressLine1: event.target.value })} />
            <Input label="Address line 2" value={form.addressLine2 || ""} onChange={(event) => set({ addressLine2: event.target.value })} />
            <Input label="City" value={form.city || ""} onChange={(event) => set({ city: event.target.value })} />
            <Input label="State" value={form.state || ""} onChange={(event) => set({ state: event.target.value })} />
            <Input label="Pincode" value={form.pincode || ""} onChange={(event) => set({ pincode: event.target.value })} />
            <Input label="Phone" value={form.phone || ""} onChange={(event) => set({ phone: event.target.value })} />
            <Input label="Email" value={form.email || ""} onChange={(event) => set({ email: event.target.value })} />
            <Select label="Default payment mode" value={form.defaultPaymentMode || "Cash"} onChange={(event) => set({ defaultPaymentMode: event.target.value })}>
              {["Cash", "UPI", "Card", "Bank Transfer", "Cheque", "Other"].map((mode) => <option key={mode}>{mode}</option>)}
            </Select>
            <Input className="span-two" label="Maps link" value={form.mapsLink || ""} onChange={(event) => set({ mapsLink: event.target.value })} />
            <Textarea className="span-two" label="Default terms" value={form.defaultTerms || ""} onChange={(event) => set({ defaultTerms: event.target.value })} />
          </div>
        </div>

        <div className="panel-section">
          <div className="section-heading"><h2>Payment Details</h2></div>
          <div className="form-grid two">
            <Input label="UPI ID" value={form.upiId || ""} onChange={(event) => set({ upiId: event.target.value })} />
            <Input label="Account holder" value={form.bankAccountName || ""} onChange={(event) => set({ bankAccountName: event.target.value })} />
            <Input label="Bank name" value={form.bankName || ""} onChange={(event) => set({ bankName: event.target.value })} />
            <Input label="Account number" value={form.bankAccountNumber || ""} onChange={(event) => set({ bankAccountNumber: event.target.value })} />
            <Input label="IFSC code" value={form.bankIfsc || ""} onChange={(event) => set({ bankIfsc: event.target.value })} />
            <Input label="Branch" value={form.bankBranch || ""} onChange={(event) => set({ bankBranch: event.target.value })} />
          </div>
        </div>

        <div className="upload-grid">
          <div className="upload-card">
            <div>
              <h3>Logo</h3>
              <p>Shown on invoice header.</p>
            </div>
            <ImagePreview src={form.logoUrl || "/logo.webp"} alt="Company logo" compact />
            <FileUpload label={form.logoUrl ? "Replace logo" : "Logo upload"} onChange={(file) => logoMutation.mutate(file)} />
          </div>
          <div className="upload-card">
            <div>
              <h3>Signature</h3>
              <p>Shown in authorized signatory area.</p>
            </div>
            {form.signatureImageUrl && <ImagePreview src={form.signatureImageUrl} alt="Company signature" compact />}
            <FileUpload label={form.signatureImageUrl ? "Replace signature" : "Signature upload"} onChange={(file) => signatureMutation.mutate(file)} />
          </div>
          <div className="upload-card">
            <div>
              <h3>Payment QR</h3>
              <p>Shown for UPI invoices.</p>
            </div>
            {form.paymentQrUrl && <ImagePreview src={form.paymentQrUrl} alt="Payment QR code" compact />}
            <FileUpload label={form.paymentQrUrl ? "Replace QR" : "QR upload"} onChange={(file) => paymentQrMutation.mutate(file)} />
          </div>
        </div>
        <div className="form-actions"><Button type="submit" disabled={saveMutation.isPending}>Save</Button></div>
      </form>
    </section>
  );
}
