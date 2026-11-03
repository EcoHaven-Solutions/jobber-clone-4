#!/usr/bin/env python3
"""Adds a "Photos of the area" picker to the public estimate form.

Standalone page (in your repo), run from ~/Downloads/jobber-clone :
    python3 patch_form_photos.py quote-page/index.html
Any other copy of the form (for example the Wix one) works the same way:
    python3 patch_form_photos.py /path/to/that-file.html
"""
import sys, os

MARK = 'PHOTO-UPLOAD-PATCH'
path = sys.argv[1] if len(sys.argv) > 1 else 'quote-page/index.html'
if not os.path.exists(path):
    sys.exit(f"Can't find {path} -- run this from your jobber-clone folder, or give the file path.")
src = open(path, encoding='utf-8').read()
if MARK in src:
    print(f"{path}: already patched, skipping"); sys.exit(0)

edits = [
 ('styles', "  </style>",
  """    /* PHOTO-UPLOAD-PATCH */
    input[type="file"] { padding: 10px; background: #2E2E2C; cursor: pointer; }
    #photo-previews { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .photo-thumb { position: relative; width: 74px; height: 74px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.25); }
    .photo-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .photo-thumb button { position: absolute; top: 2px; right: 2px; width: 22px; height: 22px; border: none; border-radius: 50%; background: rgba(0,0,0,0.7); color: #fff; font-size: 14px; line-height: 20px; padding: 0; cursor: pointer; }
    #photo-note { margin-top: 6px; font-size: 12px; color: #D6E9F1; }
  </style>"""),
 ('photo picker',
  """        <textarea id="f-message" rows="3" placeholder="Any other details about your project…"></textarea>
""",
  """        <textarea id="f-message" rows="3" placeholder="Any other details about your project…"></textarea>

        <label>Photos of the area (optional, up to 6)</label>
        <input type="file" id="f-photos" accept="image/*" multiple />
        <div id="photo-previews"></div>
        <div id="photo-note">Photos help us give you a more accurate estimate.</div>
"""),
 ('send photos',
  "            selectedServices: selectedList,\n",
  "            selectedServices: selectedList,\n            photos: photos.map(function (p) { return { name: p.name, data: p.data }; }),\n"),
 ('sending text',
  "      btn.textContent = 'Sending…';\n      msg.textContent = '';\n",
  "      btn.textContent = photos.length ? 'Uploading photos…' : 'Sending…';\n      msg.textContent = '';\n"),
 ('photo code',
  "    document.getElementById('quote-form').addEventListener('submit', async function (e) {",
  r"""    // ---- Photos (PHOTO-UPLOAD-PATCH) ----
    // Each photo is shrunk on the visitor's phone (max 1600px, JPEG) before
    // it is sent, so uploads stay fast even on cell data.
    var MAX_PHOTOS = 6;
    var photos = []; // { name, data (base64), preview (data URL) }

    function shrinkImage(file) {
      return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () {
          try {
            var attempts = [[1600, 0.8], [1280, 0.7], [1000, 0.6]];
            var dataUrl = '';
            for (var i = 0; i < attempts.length; i++) {
              var maxSide = attempts[i][0];
              var scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
              var canvas = document.createElement('canvas');
              canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
              canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
              var ctx = canvas.getContext('2d');
              ctx.fillStyle = '#fff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              dataUrl = canvas.toDataURL('image/jpeg', attempts[i][1]);
              if (dataUrl.length < 900000) break; // ~650 KB
            }
            URL.revokeObjectURL(url);
            resolve(dataUrl);
          } catch (err) { URL.revokeObjectURL(url); reject(err); }
        };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
        img.src = url;
      });
    }

    function renderPhotoPreviews() {
      var box = document.getElementById('photo-previews');
      box.innerHTML = '';
      photos.forEach(function (p, idx) {
        var d = document.createElement('div');
        d.className = 'photo-thumb';
        var im = document.createElement('img');
        im.src = p.preview;
        im.alt = 'Photo ' + (idx + 1);
        var x = document.createElement('button');
        x.type = 'button';
        x.setAttribute('aria-label', 'Remove photo');
        x.textContent = '×';
        x.addEventListener('click', function () { photos.splice(idx, 1); renderPhotoPreviews(); });
        d.appendChild(im);
        d.appendChild(x);
        box.appendChild(d);
      });
    }

    document.getElementById('f-photos').addEventListener('change', async function (e) {
      var input = e.target;
      var files = Array.prototype.slice.call(input.files || []);
      input.value = '';
      var note = document.getElementById('photo-note');
      note.style.color = '#D6E9F1';
      note.textContent = 'Photos help us give you a more accurate estimate.';
      for (var i = 0; i < files.length; i++) {
        if (photos.length >= MAX_PHOTOS) {
          note.style.color = '#F2C97D';
          note.textContent = 'Up to ' + MAX_PHOTOS + ' photos, please. The rest were skipped.';
          break;
        }
        try {
          var dataUrl = await shrinkImage(files[i]);
          photos.push({ name: files[i].name || ('photo-' + (photos.length + 1) + '.jpg'), data: dataUrl.split(',')[1], preview: dataUrl });
        } catch (err) {
          note.style.color = '#F2C97D';
          note.textContent = "Couldn't read " + (files[i].name || 'one photo') + ' - try a JPEG or PNG photo instead.';
        }
      }
      renderPhotoPreviews();
    });

    document.getElementById('quote-form').addEventListener('submit', async function (e) {"""),
]

for label, old, new in edits:
    n = src.count(old)
    if n != 1:
        sys.exit(f"{path}: '{label}' matched {n} times (expected 1). Nothing was changed.")
    src = src.replace(old, new)
open(path, 'w', encoding='utf-8').write(src)
print(f"{path}: patched ({len(edits)} edits)")
