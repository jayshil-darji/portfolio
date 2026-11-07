import sys, os
from multiprocessing import Pool
sys.path.insert(0, '.')
import render
T_END = render.T_INTRO + render.LOOP
N = int(round(T_END * render.FPS))
def job(i):
    render.frame(i / render.FPS, f"frames/f_{i:05d}.png")
if __name__ == "__main__":
    with Pool(2) as p:
        p.map(job, range(N), chunksize=8)
    print(N)
