-- Fix common UTF-8 mojibake introduced by mis-encoded seed data
-- This migration normalizes a few French accented characters and the Euro symbol
-- across content tables used by the frontend.

do $$
begin
  -- Services.title
  if to_regclass('public.services') is not null then
    update public.services set title = (
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(title,
                  'Ã‰','É'
                ),
                'Ã©','é'
              ),
              'Ã¨','è'
            ),
            'Ã ','à'
          ),
          'â‚¬','€'
        ),
        'Â€','€'
      )
    )
    where title ~ '(Ã|â‚¬|Â€)';
  end if;

  -- service_items: label, description, price
  if to_regclass('public.service_items') is not null then
    update public.service_items set label = (
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(label,
                  'Ã‰','É'
                ),
                'Ã©','é'
              ),
              'Ã¨','è'
            ),
            'Ã ','à'
          ),
          'â‚¬','€'
        ),
        'Â€','€'
      )
    ) where label ~ '(Ã|â‚¬|Â€|Â )';

    update public.service_items set description = (
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(coalesce(description, ''),
                  'Ã‰','É'
                ),
                'Ã©','é'
              ),
              'Ã¨','è'
            ),
            'Ã ','à'
          ),
          'â‚¬','€'
        ),
        'Â€','€'
      )
    ) where description is not null and description ~ '(Ã|â‚¬|Â€|Â )';

    update public.service_items set price = (
      replace(replace(replace(price,'â‚¬','€'),'Â€','€'),'Â ',' ')
    ) where price ~ '(â‚¬|Â€|Â )';
  end if;

  -- promotions: title, description, price, original_price
  if to_regclass('public.promotions') is not null then
    update public.promotions set title = (
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(title,
                  'Ã‰','É'
                ),
                'Ã©','é'
              ),
              'Ã¨','è'
            ),
            'Ã ','à'
          ),
          'â‚¬','€'
        ),
        'Â€','€'
      )
    ) where title ~ '(Ã|â‚¬|Â€|Â )';

    update public.promotions set description = (
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(coalesce(description, ''),
                  'Ã‰','É'
                ),
                'Ã©','é'
              ),
              'Ã¨','è'
            ),
            'Ã ','à'
          ),
          'â‚¬','€'
        ),
        'Â€','€'
      )
    ) where description is not null and description ~ '(Ã|â‚¬|Â€|Â )';

    update public.promotions set price = (
      replace(replace(replace(price,'â‚¬','€'),'Â€','€'),'Â ',' ')
    ) where price ~ '(â‚¬|Â€|Â )';

    update public.promotions set original_price = (
      replace(replace(replace(original_price,'â‚¬','€'),'Â€','€'),'Â ',' ')
    ) where original_price is not null and original_price ~ '(â‚¬|Â€|Â )';
  end if;
end$$;

-- Verification quick checks (optional, harmless if run multiple times)
-- select title from public.services;
-- select label, price from public.service_items;
-- select title, price from public.promotions;
