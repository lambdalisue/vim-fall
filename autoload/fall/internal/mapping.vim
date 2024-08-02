function! fall#internal#mapping#store() abort
  if exists('s:saved_maps')
    return
  endif
  let s:saved_maps = maplist()->filter({ _, m -> m.mode ==# 'c' || m.mode ==# '!' })
endfunction

function! fall#internal#mapping#restore()
  if !exists('s:saved_maps')
    return
  endif
  cmapclear
  for l:m in s:saved_maps
    call mapset(l:m)
  endfor
  unlet s:saved_maps
endfunction
