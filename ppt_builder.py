from pptx import Presentation

def _replace_in_shape(shape, mapping: dict):
    if not shape.has_text_frame:
        return

    for paragraph in shape.text_frame.paragraphs:
        full_text = "".join(run.text for run in paragraph.runs)
        if not full_text:
            continue

        replaced = full_text
        for k, v in mapping.items():
            if k in replaced:
                replaced = replaced.replace(k, str(v))

        if replaced != full_text:
            if paragraph.runs:
                for run in paragraph.runs:
                    run.text = ""
                paragraph.runs[0].text = replaced
            else:
                paragraph.add_run().text = replaced


def _build_mapping_from_deck(deck: dict) -> dict:
    slides = deck.get("slides", []) or []
    mapping = {}

    for i in range(8):
        s = slides[i] if i < len(slides) else {}
        idx = i + 1

        mapping[f"{{{{S{idx}_TITLE}}}}"] = s.get("title", "")
        mapping[f"{{{{S{idx}_SUBTITLE}}}}"] = s.get("subtitle", "")

        bullets = s.get("bullets", []) or []
        for b in range(3):
            mapping[f"{{{{S{idx}_B{b+1}}}}}"] = bullets[b] if b < len(bullets) else ""

        numbers = s.get("numbers", []) or []
        for n in range(4):
            item = numbers[n] if n < len(numbers) else {}
            mapping[f"{{{{S{idx}_N{n+1}_LABEL}}}}"] = item.get("label", "") if item else ""
            mapping[f"{{{{S{idx}_N{n+1}_VALUE}}}}"] = item.get("value", "") if item else ""

    return mapping


def build_pptx(deck: dict, out_path: str, template_path: str = "template.pptx"):
    prs = Presentation(template_path)
    mapping = _build_mapping_from_deck(deck)

    print("=== MAPPING ===")
    print(mapping)

    for slide in prs.slides:
        for shape in slide.shapes:
            _replace_in_shape(shape, mapping)

    prs.save(out_path)