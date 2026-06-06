const { Writable } = require("stream");

const mockUploadStream = jest.fn((options, callback) =>
  new Writable({
    write(_chunk, _encoding, done) {
      done();
    },
    final(done) {
      callback(null, {
        secure_url: `https://res.cloudinary.com/demo/${options.resource_type}/upload/${options.folder}/${options.public_id}`,
        public_id: options.public_id
      });
      done();
    }
  })
);

jest.mock("../config/cloudinary", () => ({
  isCloudinaryConfigured: () => true,
  cloudinary: {
    uploader: {
      upload_stream: mockUploadStream,
      destroy: jest.fn()
    }
  }
}));

const { uploadRaw } = require("../services/cloudinary.service");

describe("Cloudinary upload payloads", () => {
  beforeEach(() => {
    mockUploadStream.mockClear();
    process.env.CLOUDINARY_ROOT_FOLDER = "karma-automobiles";
  });

  afterEach(() => {
    delete process.env.CLOUDINARY_ROOT_FOLDER;
  });

  test("uploads generated PDFs as raw files and keeps the .pdf extension in public_id", async () => {
    const result = await uploadRaw(Buffer.from("%PDF-1.4"), "invoices", "KA-107.pdf");

    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: "karma-automobiles/invoices",
        resource_type: "raw",
        public_id: "KA-107.pdf"
      }),
      expect.any(Function)
    );
    expect(result).toEqual({
      url: "https://res.cloudinary.com/demo/raw/upload/karma-automobiles/invoices/KA-107.pdf",
      publicId: "KA-107.pdf"
    });
  });
});
