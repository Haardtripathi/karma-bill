import { Trash2 } from "lucide-react";
import Button from "../common/Button.jsx";
import FileUpload from "../common/FileUpload.jsx";
import ImagePreview from "../common/ImagePreview.jsx";
import Input from "../common/Input.jsx";
import ItemPicker from "./ItemPicker.jsx";
import { formatCurrency, roundMoney } from "../../utils/currency.js";

const makeEmptyLine = () => ({ itemId: "", itemName: "", hsnSac: "", quantity: 1, unitPrice: 0, imageUrl: "", imagePublicId: "", imageNote: "" });

export default function LineItemsTable({ lineItems, setLineItems, inventoryItems = [], onUploadImage }) {
  const updateRow = (index, patch) => {
    setLineItems((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  };

  const selectItem = (index, selected) => {
    updateRow(index, {
      itemId: selected._id,
      itemName: selected.name,
      hsnSac: selected.hsnSac || "",
      unitPrice: selected.defaultPrice || 0
    });
  };

  const typeItemName = (index, name) => {
    const patch = name.trim()
      ? { itemId: "", itemName: name }
      : { itemId: "", itemName: "", hsnSac: "", unitPrice: 0 };
    updateRow(index, patch);
  };

  const addRow = () => setLineItems((rows) => [...rows, makeEmptyLine()]);
  const removeRow = (index) => {
    setLineItems((rows) => rows.length <= 1 ? [makeEmptyLine()] : rows.filter((_, rowIndex) => rowIndex !== index));
  };
  const removeImage = (index) => updateRow(index, { imageUrl: "", imagePublicId: "", imageNote: "" });

  return (
    <div className="panel-section line-items-section">
      <div className="section-heading">
        <div>
          <h2>Line Items</h2>
          <p>Select an inventory item or type a custom item name in the same field.</p>
        </div>
        <Button onClick={addRow}>Add item</Button>
      </div>
      <div className="table-scroll line-items-scroll">
        <table className="data-table line-items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>HSN/SAC</th>
              <th>Qty</th>
              <th>Unit price</th>
              <th className="amount-heading">Line total</th>
              <th>Image</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => {
              const amount = roundMoney(Number(item.quantity || 0) * Number(item.unitPrice || 0));
              return (
                <tr key={index}>
                  <td className="wide-cell" data-label="Item">
                    <ItemPicker
                      items={inventoryItems}
                      itemId={item.itemId}
                      itemName={item.itemName}
                      onSelect={(selected) => selectItem(index, selected)}
                      onType={(name) => typeItemName(index, name)}
                    />
                  </td>
                  <td data-label="HSN/SAC"><Input aria-label="HSN/SAC" value={item.hsnSac} onChange={(event) => updateRow(index, { hsnSac: event.target.value })} /></td>
                  <td data-label="Qty"><Input aria-label="Quantity" type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateRow(index, { quantity: event.target.value })} /></td>
                  <td data-label="Unit price"><Input aria-label="Price" type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateRow(index, { unitPrice: event.target.value })} /></td>
                  <td className="amount-cell" data-label="Line total">{formatCurrency(amount)}</td>
                  <td className="line-item-image-cell" data-label="Image">
                    <div className="image-cell-row">
                      {item.imageUrl ? (
                        <ImagePreview compact src={item.imageUrl} alt={(item.itemName || "Line item") + " image"} onReplace={(file) => onUploadImage(file, index)} onRemove={() => removeImage(index)} />
                      ) : (
                        <FileUpload compact onChange={(file) => onUploadImage(file, index)} />
                      )}
                      <Input aria-label="Image note" placeholder="Note" value={item.imageNote || ""} onChange={(event) => updateRow(index, { imageNote: event.target.value })} />
                    </div>
                  </td>
                  <td className="line-item-actions" data-label="Actions"><Button variant="ghost" className="btn-icon" aria-label="Remove item" onClick={() => removeRow(index)}><Trash2 size={17} /></Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
