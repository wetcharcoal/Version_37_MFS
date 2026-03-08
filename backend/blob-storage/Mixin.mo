import Registry "registry";

mixin(registry : Registry.Registry) {
  // Blob storage mixin for file references (header logo, profile pictures, event images).
  // Wraps Registry operations; main.mo adds authorization and exposes the public API.

  /// Stores a file reference (path -> hash) after the blob is uploaded to the gateway.
  public func storeFileReference(path : Text, hash : Text) {
    Registry.add(registry, path, hash);
  };

  /// Retrieves the file reference for a path; traps if not found.
  /// Plain sync function so main.mo's query methods can call it (no send capability needed).
  func fetchFileReference(path : Text) : Registry.FileReference {
    Registry.get(registry, path);
  };

  /// Returns all registered file references.
  /// Plain sync function so main.mo's query methods can call it (no send capability needed).
  func fetchAllFileReferences() : [Registry.FileReference] {
    Registry.list(registry);
  };

  /// Removes a file reference and marks its blob for cleanup.
  public func deleteFileReference(path : Text) {
    Registry.remove(registry, path);
  };
}
