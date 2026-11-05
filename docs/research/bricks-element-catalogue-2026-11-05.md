# Bricks native element catalogue

Generated 2026-11-05 from the Bricks 2.4.5 registry on bricks.local: the 77 native elements. The 34 snn-* elements added by the child theme are in the report, not here.

- Shared style controls: the underscore-prefixed controls every element gets (Layout, Typography, Background, Border, Gradient, Transform, Motion, CSS, Attributes). Counted per element.
- Element controls: content and settings controls the element adds on top. Labels shown: the first six.
- Core equivalent: a judgement by the report author, not a test. yes = a core block does the same job; partial = part of it; no = nothing in core.

Totals: yes 26, partial 21, no 29 (of 76).

| Element | Category | Label | Shared style controls | Element controls | Core equivalent | Core block(s) | Main element controls |
|---|---|---|---|---|---|---|---|
| `container` | layout | Container | 85 | 3 | partial | group (flex and grid via layout; no max-height, overflow or position) | Link, HTML tag, Custom tag |
| `section` | layout | Section | 85 | 3 | partial | group with tagName section | Link, HTML tag, Custom tag |
| `block` | layout | Block | 85 | 3 | partial | group | Link, HTML tag, Custom tag |
| `div` | layout | Div | 85 | 3 | partial | group | Link, HTML tag, Custom tag |
| `heading` | basic | Heading | 62 | 13 | yes | core/heading | HTML tag, Custom tag, Type, Style, Link to, Separator |
| `text-basic` | basic | Basic Text | 62 | 6 | yes | core/paragraph | HTML tag, Custom tag, Link to, Words limit, Read more |
| `text` | basic | Rich text | 62 | 5 | yes | core/paragraph | Type, Style, Words limit, Read more |
| `text-link` | basic | Text link | 62 | 11 | partial | core/paragraph with a link | Link to, Icon, Size, Width, Height, Color |
| `button` | basic | Button | 62 | 12 | yes | core/button | HTML tag, Size, Style, Circle, Outline, Link type |
| `icon` | basic | Icon | 62 | 8 | no | none (SVG in Custom HTML only) | Icon, Color, Size, Link, Is Accordion (Nestable) Icon, Show |
| `image` | basic | Image | 64 | 39 | yes | core/image | Image, HTML tag, Custom tag, Sources, Custom alt text, Caption type |
| `video` | basic | Video | 62 | 55 | partial | core/video (no embed options) | Source, Iframe title, Aspect ratio, Object fit, YouTube video ID/URL, Autoplay |
| `nav-nested` | general | Nav (Nestable) | 63 | 53 | partial | core/navigation | HTML tag, aria-label, Gap, Justify content, Padding, Background color |
| `dropdown` | general | Dropdown | 62 | 43 | partial | core/navigation-submenu | HTML tag, Text, Link to, Attribute: aria-label, Icon, Icon padding |
| `offcanvas` | general | Offcanvas | 63 | 12 | partial | core/navigation overlay | Direction, Effect, Close on, Width, Height, Transition: Duration |
| `toggle` | general | Toggle | 62 | 12 | no | none | Icon, Color, Size, Animation, aria-label, CSS selector |
| `toggle-mode` | general | Toggle - Mode | 62 | 7 | no | none | Icon, Color, Size, Icon Dark, Color, Size |
| `divider` | general | Divider | 61 | 12 | yes | core/separator | Height, Width, Style, Direction, Align, Color |
| `icon-box` | general | Icon Box | 62 | 25 | no | none (group plus icon) | Direction, Spacing, Icon, Align, Link, Margin |
| `social-icons` | general | Icon List | 62 | 8 | yes | core/social-links | Icons, Icon: Color, Icon: Size, Direction, Align items, Justify content |
| `list` | general | List | 62 | 38 | yes | core/list | List items, Justify content, Align items, Margin, Padding, Odd background |
| `accordion` | general | Accordion | 62 | 30 | partial | core/details (one item at a time) | Query loop, Query, Expand first item, Expand item indexes, Independent toggle, Transition (ms) |
| `accordion-nested` | general | Accordion (Nestable) | 63 | 19 | partial | core/details | Expand first item, Expand item indexes, Independent toggle, Transition (ms), FAQ schema, Min. height |
| `tabs` | general | Tabs | 62 | 19 | no | none | Layout, Accordion layout at breakpoint, Open tab on, Open tab index, Stretch, Align |
| `tabs-nested` | general | Tabs (Nestable) | 62 | 17 | no | none | Direction, Open tab on, Open tab index, Width, Margin, Padding |
| `form` | general | Form | 62 | 122 | no | none | Show required asterisk, Disable required asterisk in placeholder, Show labels, Label typography, Placeholder typography, Disable form validation |
| `map` | general | Map (Google) | 62 | 60 | no | none | Address, Addresses, Query loop, Query, Info Box: Template (Popup), Text: No results |
| `map-leaflet` | general | Map (Leaflet) | 62 | 20 | no | none | Icon, Icon: Height (px), Icon: Width (px), Height, Map center, Zoom level (Initial) |
| `map-connector` | general | Map Connector | 62 | 9 | no | none | Latitude, Longitude, Address, Info Box: Template (Popup), Label |
| `alert` | general | Alert | 62 | 3 | no | none | Type, Dismissable |
| `animated-typing` | general | Anim. Typing | 62 | 11 | no | none | Tag, Prefix, Suffix, Strings, Type speed in ms, Back speed in ms |
| `countdown` | general | Countdown | 61 | 13 | no | none | Date, Time zone, Date Reached, Date Reached: Custom text, Direction, Align main axis |
| `counter` | general | Counter | 62 | 10 | no | none | Count from, Count to, Animation in ms, Typography, Prefix, Typography |
| `pricing-tables` | general | Pricing Tables | 62 | 24 | no | none | Columns, Spacing, Align tables, Show tabs, Tab 1 label, Tab 2 label |
| `progress-bar` | general | Progress Bar | 62 | 9 | no | none | Height, Spacing, Show percentage, Bar color, Bar background color, Bar border |
| `pie-chart` | general | Pie Chart | 62 | 11 | no | none | Percentage, Chart size in px, Line width in px, Line cap, Content, Icon |
| `team-members` | general | Team members | 62 | 17 | partial | query loop plus group | Columns, Gap, Background, Border, Box shadow, Image position |
| `testimonials` | general | Testimonials | 61 | 53 | partial | core/quote (one at a time) | Initial slide, Items to show, Items to scroll, Spacing (px), Align items, Text align |
| `html` | general | HTML | 62 | 1 | yes | core/html | Raw HTML |
| `code` | general | Code | 62 | 5 | yes | core/code | <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 124 141.53199999999998" fill="none"><path d="M10.383 126.894L0 0l124 .255-10.979 126.639-50.553 14.638z" fill="#e34f26"/><path d="M62.468 129.277V12.085l51.064.17-9.106 104.851z" fill="#ef652a"/><path d="M99.49 41.362l1.446-15.49H22.383l4.34 47.49h54.213L78.81 93.617l-17.362 4.68-17.617-5.106-.936-12.085H27.319l2.128 24.681 32 8.936 32.255-8.936 4.34-48.17H41.107L39.49 41.362z" fill="#fff"/></svg>PHP & HTML, <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 124 141.53" fill="none" ><path d="M10.383 126.892L0 0l124 .255-10.979 126.637-50.553 14.638z" fill="#1b73ba"/><path d="M62.468 129.275V12.085l51.064.17-9.106 104.85z" fill="#1c88c7"/><path d="M100.851 27.064H22.298l2.128 15.318h37.276l-36.68 15.745 2.127 14.808h54.043l-1.958 20.68-18.298 3.575-16.595-4.255-1.277-11.745H27.83l2.042 24.426 32.681 9.106 31.32-9.957 4-47.745H64.765l36.085-14.978z" fill="#fff"/></svg>CSS, <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 1052 1052"><path fill="#f0db4f" d="M0 0h1052v1052H0z"/><path d="M965.9 801.1c-7.7-48-39-88.3-131.7-125.9-32.2-14.8-68.1-25.399-78.8-49.8-3.8-14.2-4.3-22.2-1.9-30.8 6.9-27.9 40.2-36.6 66.6-28.6 17 5.7 33.1 18.801 42.8 39.7 45.4-29.399 45.3-29.2 77-49.399-11.6-18-17.8-26.301-25.4-34-27.3-30.5-64.5-46.2-124-45-10.3 1.3-20.699 2.699-31 4-29.699 7.5-58 23.1-74.6 44-49.8 56.5-35.6 155.399 25 196.1 59.7 44.8 147.4 55 158.6 96.9 10.9 51.3-37.699 67.899-86 62-35.6-7.4-55.399-25.5-76.8-58.4-39.399 22.8-39.399 22.8-79.899 46.1 9.6 21 19.699 30.5 35.8 48.7 76.2 77.3 266.899 73.5 301.1-43.5 1.399-4.001 10.6-30.801 3.199-72.101zm-394-317.6h-98.4c0 85-.399 169.4-.399 254.4 0 54.1 2.8 103.7-6 118.9-14.4 29.899-51.7 26.2-68.7 20.399-17.3-8.5-26.1-20.6-36.3-37.699-2.8-4.9-4.9-8.7-5.601-9-26.699 16.3-53.3 32.699-80 49 13.301 27.3 32.9 51 58 66.399 37.5 22.5 87.9 29.4 140.601 17.3 34.3-10 63.899-30.699 79.399-62.199 22.4-41.3 17.6-91.3 17.4-146.6.5-90.2 0-180.4 0-270.9z" fill="#323330"/></svg>JavaScript, Theme |
| `template` | general | Template | 62 | 2 | partial | core/template-part | Template, Render without wrapper |
| `logo` | general | Logo | 62 | 8 | yes | core/site-logo | Logo, Logo inverse, Logo dark mode, Height, Width, Text |
| `facebook-page` | general | Facebook Page | 62 | 8 | partial | core/embed | Facebook page URL, Height (px), Width (px), Tabs, Hide cover, Show friends&#039; photos |
| `breadcrumbs` | general | Breadcrumbs | 62 | 22 | no | none | Gap, Add context, URL, Text, Icon, Icon: Gap |
| `rating` | general | Rating | 62 | 13 | no | none | Rating, Max. rating, Gap, Icon, Icon color: Full, Icon color: Empty |
| `back-to-top` | general | Back to Top | 62 | 11 | no | none | HTML tag, aria-label, Position, Top, Right, Bottom |
| `image-gallery` | media | Image gallery | 62 | 24 | yes | core/gallery | Images, Layout, Columns, Spacing, Image height, Image ratio |
| `audio` | media | Audio | 62 | 12 | yes | core/audio | Source, File, Custom title, Show artist, Show title, Autoplay |
| `file` | media | File | 62 | 20 | yes | core/file | Source, Hide file name, Custom file name, Open in new tab, Hide download button, Text |
| `carousel` | media | Carousel | 62 | 71 | no | none | Type, Images, Query, Adaptive height, Height, Spacing (px) |
| `slider` | media | Slider | 62 | 66 | no | none | Slides, Query loop, Query, Items to show, Items to scroll, Spacing (px) |
| `slider-nested` | media | Slider (Nestable) | 63 | 64 | no | none | Options type, Custom options, Type, Direction, Keyboard, Auto height |
| `svg` | media | SVG | 62 | 10 | partial | core/image (svg) or Custom HTML | Source, SVG icon, Dynamic data, Height, Width, Stroke width |
| `instagram-feed` | media | Instagram feed | 62 | 26 | partial | core/embed | Columns, Posts, Object fit, Aspect ratio, Height, Width |
| `pagination` | query | Pagination | 62 | 16 | yes | core/query-pagination | Query, Alignment, Height, Width, Spacing, Background |
| `query-results-summary` | query | Query Results Summary | 62 | 4 | partial | no exact block | Query, Format, Text: One Result, Text: No results |
| `wordpress` | wordpress | WordPress | 62 | 23 | no | none | Widget, Icon, Icon typography, Show count, Sort by, Include |
| `posts` | wordpress | Posts | 62 | 52 | yes | core/query | Query, Link entire post, Layout, Direction (Item), Columns, Columns |
| `nav-menu` | wordpress | Nav Menu | 62 | 96 | yes | core/navigation | Menu (WordPress), ARIA label, Alignment, Justify content, Gap, Margin |
| `sidebar` | wordpress | Sidebar | 62 | 6 | partial | widget areas | Sidebar, Widget margin, Title typography, Content typography, Search background color, Search border |
| `search` | wordpress | Search | 62 | 37 | yes | core/search | Type, aria-label, Action URL, Additional parameters, Height, Width |
| `shortcode` | wordpress | Shortcode | 62 | 4 | yes | core/shortcode | Shortcode, Don&#039;t render in builder, Placeholder: Width, Placeholder: Height |
| `post-title` | single | Post title | 62 | 12 | yes | core/post-title | HTML tag, Type, Style, Link to post, Prefix, Spacing |
| `post-excerpt` | single | Excerpt | 62 | 3 | yes | core/post-excerpt | Excerpt length, More text, Keep formatting |
| `post-meta` | single | Meta Data | 62 | 5 | partial | core/post-date, core/post-author | Direction, Gap, Separator, Separator color |
| `post-content` | single | Post content | 62 | 0 | yes | core/post-content |  |
| `post-sharing` | single | Social Sharing | 62 | 5 | no | none | Share via, Use brand colors, Direction, Open in new tab, Rel attribute |
| `related-posts` | single | Related posts | 62 | 24 | partial | core/query | Title, HTML tag, Margin, Typography, Post type, Max. related posts |
| `post-author` | single | Author | 62 | 19 | yes | core/post-author | Show avatar, Avatar size, Avatar position, Avatar border, Avatar box shadow, Show name |
| `post-comments` | single | Comments | 62 | 32 | yes | core/comments | Source, Show title, HTML tag, Typography, Show avatar, Size |
| `post-taxonomy` | single | Taxonomy | 62 | 9 | yes | core/post-terms | Taxonomy, Disable link, Separator, Order by, Order, Size |
| `post-navigation` | single | Post navigation | 63 | 21 | yes | core/post-navigation-link | Max. post width, In same term, Excluded terms, Taxonomy, Show label, Prev label |
| `post-reading-time` | single | Reading time | 62 | 6 | no | none | Content selector, Prefix, Suffix, Calculation method, Words per minutes, Characters per minute |
| `post-reading-progress-bar` | single | Reading progress bar | 62 | 5 | no | none | Content selector, Position, Bar height, Bar color, Bar background color |
| `post-toc` | single | Table of contents | 62 | 13 | no | none | Content selector, Heading selectors, Ignore selector, Collapse inactive, No wrap, Sticky |
| `multi-step-form` | general | Multi-Step Form | 62 | 7 | no | none | Form Selector, Button Background Color, Button Typography, Progress Bar Color, Progress Indicator Color, Back Button Text |
