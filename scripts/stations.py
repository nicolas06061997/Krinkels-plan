"""Télécharge les stations Total de Belgique depuis OpenStreetMap (Overpass) vers stations.json."""
import json, sys, time, urllib.parse, urllib.request

Q = ('[out:json][timeout:180];area["ISO3166-1"="BE"][admin_level=2]->.a;'
     '(nwr(area.a)["amenity"="fuel"]["brand"~"Total",i];nwr(area.a)["amenity"="fuel"]["name"~"Total",i];);out center tags;')
EPS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter",
       "https://overpass.private.coffee/api/interpreter"]

def fetch():
    body = urllib.parse.urlencode({"data": Q}).encode()
    for attempt in range(3):
        for ep in EPS:
            try:
                req = urllib.request.Request(ep, data=body, headers={"User-Agent": "krinkels-plan (GitHub Actions)"})
                with urllib.request.urlopen(req, timeout=240) as r:
                    return json.load(r)
            except Exception as e:
                print(f"{ep}: {e}", file=sys.stderr)
        time.sleep(30)
    sys.exit("Aucun serveur Overpass n'a répondu")

seen, out = set(), []
for e in fetch().get("elements", []):
    g = e.get("tags", {})
    la = e.get("lat", e.get("center", {}).get("lat"))
    lo = e.get("lon", e.get("center", {}).get("lon"))
    i = e["type"] + str(e["id"])
    if la is None or i in seen:
        continue
    seen.add(i)
    out.append({"id": i, "lat": round(la, 6), "lon": round(lo, 6), "nom": g.get("name") or g.get("brand") or "Total",
                "rue": f'{g.get("addr:housenumber", "")} {g.get("addr:street", "")}'.strip(),
                "ville": f'{g.get("addr:postcode", "")} {g.get("addr:city", "")}'.strip(),
                "h": g.get("opening_hours", ""), "dz": g.get("fuel:diesel") == "yes"})
if len(out) < 50:
    sys.exit(f"Seulement {len(out)} stations : résultat suspect, fichier non modifié")
out.sort(key=lambda s: s["id"])
with open("stations.json", "w", encoding="utf-8") as f:
    json.dump({"t": int(time.time() * 1000), "list": out}, f, ensure_ascii=False, separators=(",", ":"))
print(f"{len(out)} stations Total enregistrées")
