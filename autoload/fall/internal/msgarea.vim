let s:counter = 0

function! fall#internal#msgarea#hide() abort
  let s:counter += 1
  call s:hide_msgarea()
  redraw
endfunction

function! fall#internal#msgarea#show() abort
  let s:counter -= 1
  if s:counter <= 0
    let s:counter = 0
    call s:show_msgarea()
    redraw
  endif
endfunction

if has('nvim')
  function! s:hide_msgarea() abort
    if exists('s:hl_msgarea')
      return
    endif
    let s:hl_msgarea = nvim_get_hl(0, #{ name: 'MsgArea' })
    let l:hl_normal = nvim_get_hl(0, #{ name: 'Normal' })
    if !has_key(l:hl_normal, 'bg')
      " guifg=NONE is not supported
      unlet! s:hl_msgarea
      return
    endif
    call nvim_set_hl(0, 'MsgArea', #{ fg: l:hl_normal.bg, bg: l:hl_normal.bg })
  endfunction

  function! s:show_msgarea() abort
    if !exists('s:hl_msgarea')
      return
    endif
    call nvim_set_hl(0, 'MsgArea', s:hl_msgarea)
    unlet s:hl_msgarea
  endfunction
else
  function! s:hide_msgarea() abort
    if exists('s:hl_msgarea')
      return
    endif
    let s:hl_msgarea = hlget('MsgArea')
    let l:hl_normal = hlget('Normal')
    if !has_key(l:hl_normal[0], 'guibg')
      " guifg=NONE is not supported
      unlet! s:hl_msgarea
      return
    endif
    call hlset([#{ name: 'MsgArea', guifg: l:hl_normal[0].guibg, guibg: l:hl_normal[0].guibg }])
  endfunction

  function! s:show_msgarea() abort
    if !exists('s:hl_msgarea')
      return
    endif
    call hlset(s:hl_msgarea)
    unlet s:hl_msgarea
  endfunction
endif
