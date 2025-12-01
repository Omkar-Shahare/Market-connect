-- Function to deduct inventory when an order item is created
CREATE OR REPLACE FUNCTION deduct_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the product quantity
  UPDATE products
  SET min_order_quantity = min_order_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run after an order item is inserted
DROP TRIGGER IF EXISTS trigger_deduct_inventory ON order_items;
CREATE TRIGGER trigger_deduct_inventory
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION deduct_inventory_on_order();
