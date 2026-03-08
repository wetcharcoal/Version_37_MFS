import Registry "registry";

module BlobStorage(registry : Registry.Registry) {
  // Blob storage mixin for file references (header logo, profile pictures, event images).
  // Wraps Registry operations; main.mo adds authorization and exposes the public API.

  /// Stores a file reference (path -> hash) after the blob is uploaded to the gateway.
  public func storeFileReference(path : Text, hash : Text) {
    Registry.add(registry, path, hash);
  };

  /// Retrieves the file reference for a path; traps if not found.
  public query func fetchFileReference(path : Text) : Registry.FileReference {
    Registry.get(registry, path);
  };

  /// Returns all registered file references.
  public query func fetchAllFileReferences() : [Registry.FileReference] {
    Registry.list(registry);
  };

  /// Removes a file reference and marks its blob for cleanup.
  public func deleteFileReference(path : Text) {
    Registry.remove(registry, path);
  };
};
