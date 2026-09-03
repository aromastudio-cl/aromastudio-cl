alter table public.product_reviews
  drop constraint if exists product_reviews_comment_check;

alter table public.product_reviews
  add constraint product_reviews_comment_check
  check (char_length(trim(comment)) between 1 and 1200);
