import ProductForm from '../ProductForm'

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-1">Add Product</h1>
      <p className="text-sm text-gray-500 mb-6">Create a new product listing for the storefront.</p>
      <ProductForm />
    </div>
  )
}
