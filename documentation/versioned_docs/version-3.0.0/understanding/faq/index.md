---
sidebar_position: 3
title: FAQ
---

## Frequently Asked Questions

### What is a hash?

A hash is like a fingerprint for your data. It is a short, unique string generated from your content. If even one character of your data changes, the hash will be completely different. This lets you verify that your data has not been tampered with.

### What happens if I lose my decryption key?

Your data cannot be recovered -- not even by the service operators. The decryption key is returned only once when you store private data. Store it securely immediately.

### What is the difference between public and private storage?

Public storage keeps your data as-is -- anyone with the link can read it. Private storage automatically encrypts your data before storing it, and only someone with the decryption key can read it. See [How It Works](../how-it-works) for the full explanation.

### Do I need to encrypt my data before sending it?

No. If you use the private endpoint (`/private`), the service encrypts your data automatically. You send it in plain form and receive an encrypted copy plus a decryption key.

### Can someone guess my document's URL?

Extremely unlikely. Each document is assigned a UUID (a long, random identifier) that is practically impossible to guess or enumerate. However, if someone does obtain a URL: public data can be read directly, while private data remains encrypted and unreadable without the decryption key.

### What file types can I upload?

The allowed file types are configurable by the service operator. By default, the service accepts PNG, JPEG, and WebP images, as well as PDF documents. See [Configuration](../../deployment-guide/configuration) for how to customise this.

### Is there a size limit for uploads?

Yes. The maximum upload size is configurable and applies to both JSON data and file uploads. The default limit is 10 MB. See [Configuration](../../deployment-guide/configuration) for how to change this.
